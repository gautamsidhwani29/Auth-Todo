const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email : {
        type : String,
        unique : true
    },
    password : String,
    username : {
        type: String,
        unique : true
    }
});

const UserModel = mongoose.model('sudouser',UserSchema);

module.exports = {
    UserModel
}