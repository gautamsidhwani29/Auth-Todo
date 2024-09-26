import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

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


export const UserModel = mongoose.model('sudouser',UserSchema);

const TodosSchema = new Schema({
    title : {type : String, required : true},
    isCompleted : {type: Boolean, default : false},
    userId : {type: ObjectId, ref :'UserModel', required: true}
})

export const TodoModel = mongoose.model('Todo',TodosSchema);


// module.exports = {
//     UserModel
// }