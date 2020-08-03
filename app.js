//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose= require("mongoose");

const app = express();


app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//Establish connection to the database
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser:true, useUnifiedTopology: true});

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
    const customListName = req.params.customListName;

    let day = date.getDate();

    List.findOne({name: customListName}, function(err, results){
        if(!err){
            if(!results){
               const list = new List({
                name: customListName,
                items: defaultItems 
            });
            //save the new custom list in the database
            list.save();
            //redirect 
            res.redirect("/" + customListName);
        }else {
            //show existing list
            res.render("list", {listDate: day, listTitle:results.name,  newListItem: results.items});
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

app.listen(3000, function(){
    console.log("Server started on port 3000");
});
