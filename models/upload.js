const { Schema, model } = require("mongoose");

const imageschema = new Schema({
    desc: {
        type: String,
    },
    date: {
        type: String,
    },
    uploaded_by: {
        type: String,
    },
    attach: [
        {
            type: String,
        }
    ],
    reactions: [
        {
            type: Array,
        }
    ]
});

module.exports = model("images", imageschema);