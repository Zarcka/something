import { Schema, model } from "mongoose";

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

export default model<any>("images", imageschema);