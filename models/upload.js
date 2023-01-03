const { Schema, model } = require("mongoose");

const imageschema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    desc: {
        type: String,
    },
    date: {
        type: String,
    },
    username: {
        type: String,
    },
    discriminator: {
        type: Number,
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