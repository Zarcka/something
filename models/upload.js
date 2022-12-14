const { Schema, model } = require("mongoose");

const imageschema = new Schema({
    desc: {
        type: String,
    },
    date: {
        type: String,
    },
    attach: [
        {
            type: String,
        }
    ]
});

module.exports = model("images", imageschema);