const mongoose = require('mongoose');
const bcrypt = require('bcrypt')


const productSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },

    title: {
        type: String,
        required: false
    } ,

    firstParagraph: {
       
       type: String,

       required: false

    } ,

    imageSrc: {

        type: String,
        required: false
    } 
})

productSchema.statics.findAndValidate = async function (username, password) {
    const foundUser = await this.findOne({ username });
    const isValid = await bcrypt.compare(password, foundUser.password);
    return isValid ? foundUser : false;
}

productSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
})

const Product = mongoose.model('Product', productSchema);

module.exports = Product;