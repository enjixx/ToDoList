//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose= require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//Establish connection to the database
mongoose.connect("mongodb+srv://enji_k:Enjilove1@cluster0.7brfw.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser:true, useUnifiedTopology: true, useFindAndModify: false});

//New todoList Schema
const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

//New model
const Item = mongoose.model("item", itemsSchema);

const List = mongoose.model("list", listSchema);

//Init default document
const item1 = new Item({
    name: "Welcome to your ToDo List"
});

const item2 = new Item({
    name: "Press + button to add new todo item"
});

const item3 = new Item({
    name: "<-- Hit this to check off an item"
});

const defaultItems = [item1, item2, item3];
 

app.get("/", function(req, res){

    let day = date.getDate();

    Item.find(function(err, items){

        if(items.length === 0){

            //Insert default items to the Item collection if list is empty
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Successfully added default items");
                }
                });
                res.redirect("/");
        }
        else{
             res.render("list",{listDate: day, listTitle: "Today",  newListItem: items});
        }
    });
    
});


app.get("/:customListName", function(req, res){
    const customListName = _.startCase(_.toLower(req.params.customListName));

    let day = date.getDate();

    List.findOne({name: customListName}, function(err, results){
        if(!err){
            if(customListName !== "Favicon Ico"){
                if(!results){
               const list = new List({
                name: customListName,
                items: defaultItems 
                });
                //save the new custom list in the database
                list.save();
                console.log("new list created called " + customListName);
                //redirect 
                res.redirect("/" + customListName);
                }else {
                    //show existing list
                    res.render("list", {listDate: day, listTitle:results.name,  newListItem: results.items});
                }
            }
        }
            
    });
});
    
    
app.post("/", function(req, res){

   const itemName = req.body.newItem;
   const listName = req.body.list;
   
   //New document
   const item = new Item({
       name: itemName
   });

    if(req.body.list === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }  
});

app.post("/delete", function(req, res){
    const checkedItem= req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.deleteOne({_id: checkedItem}, function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log("Successfully deleted");
            }
        });
        res.redirect("/");
    }else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id:checkedItem}}}, function(err, results){
            if(!err){
                console.log("Successfully deleted from " + listName);
                res.redirect("/" + listName);
            }
        });
    }  
});

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function(){
    console.log("Server started on port 3000");
});
