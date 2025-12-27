const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

app.get("/", (req,res)=>{
  res.json({status:"Backend running"});
});

/* ==== ROUTES ==== */
app.post("/register",(req,res)=>{
  res.json({message:"register ok"});
});

app.post("/login",(req,res)=>{
  res.json({message:"login ok"});
});

/* ================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server running on", PORT));

