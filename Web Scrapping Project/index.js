const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const ejs = require('ejs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/product');
const methodOverride = require('method-override')
const bcrypt = require('bcrypt');
const session = require('express-session');




main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/HelloWorld');
  
  
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   console.log("we're connected!");
});


const app = express();

app.use(express.json())

app.use(express.urlencoded({ extended: true }));

app.use(session({ secret: 'notagoodsecret' }))

app.use(methodOverride('_method'))

app.set('view engine', 'ejs');

//app.use(methodOverride('_method'))

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
      return res.redirect('/login')
  }
  next();
}

app.get('/', (req, res) => {
    res.render('form'); // render the form.ejs template
  });

app.get('/login', (req, res) => {
    res.render('login'); // render the form.ejs template
  });

  app.get('/register', (req, res) => {
    res.render('register')
})

  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await Product.findAndValidate(username, password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        res.redirect('/');
    }
    else {
        res.redirect('/login')
    }
})

app.post('/register', async (req, res) => {
  const { password, username } = req.body;
  const user = new Product({ username, password })
  await user.save();
  req.session.user_id = user._id;
  res.redirect('/')
})


app.post('/submit', (req, res) => 

{
    const inputData = req.body.inputData;

    console.log(`Received input data: ${inputData}`);
  
    //res.send('Form submitted successfully!');

    res.redirect(`/result?inputData=${inputData}`);
});

app.post('/show', async (req, res) => {
  const { title, firstParagraph, imageSrc } = req.body;
  const userId = req.session.user_id;
  
  try {
    // Update the user's product
    const updatedProduct = await Product.findByIdAndUpdate(
      userId,
      { title, firstParagraph, imageSrc },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).send('Product not found');
    }
    
    res.redirect('/show');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating product');
  }
});





app.get('/result', async (req, res) => {
  const inputData = req.query.inputData;

  try {
    const response = await axios.get(`https://en.wikipedia.org/wiki/${inputData}`);
    
    const html = response.data;

    const $ = cheerio.load(html);

    const firstParagraph = $('p').eq(1).text();
    const title = $('h1').eq(0).text();
    const firstImageSrc = $('table').eq(0).find('img').eq(0).attr('src');
    
    const user_id = req.session.user_id;

    res.render('index', { title, firstParagraph, firstImageSrc, imageUrl: firstImageSrc, user_id });
  } 
  catch (error) {
    console.error(error);
  }
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  // req.session.destroy();
  res.redirect('/');
})

app.get('/show', async (req, res) => {

  try {
    const products = await Product.find();

    res.render('show', { products });

  } catch (err) {

    console.error(err);

    res.status(500).send('Error retrieving products from database');
  }
});

app.get('/products/:id', (req, res) => {
  
  const productId = req.params.id;

  console.log(productId);

  const firstParagraph =  req.query.firstParagraph;

  //console.log(firstParagraph);

    res.render('edit',{productId, firstParagraph});
});

app.put('/edit/:id', async(req, res) => {

  const firstParagraph = req.body.firstParagraph;

  const productId = req.params.id;

  await Product.findByIdAndUpdate(productId, { firstParagraph }, { upsert: true, runValidators: true });


  res.redirect(`/show`);

});

app.delete('/products/:id', async(req, res) => {
  
  const productId = req.params.id;

  console.log(productId);

  await Product.findByIdAndDelete(productId);

    res.redirect(`/show`);
});

app.listen(3000, () => 

{

  console.log('Server is listening on port 3000!');


});



