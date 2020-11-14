const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    type: {
        type: String,
        required: true,
        trim: true,
    },
    data: {
      type: Object
    },
    seen: {
      type: Boolean,
      default: false
    }
}, {
    timestamps: true
});

const Notifications = mongoose.model('Notification', notificationSchema);

module.exports = Notifications;