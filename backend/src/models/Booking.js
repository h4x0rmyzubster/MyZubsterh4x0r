const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    skillId: {
        type: String, // Cambiato da ObjectId a String per test
        required: true
    },
    clientId: {
        type: String, // Cambiato da ObjectId a String per test
        required: true
    },
    professionalId: {
        type: String, // Cambiato da ObjectId a String per test
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true,
        enum: ['09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
                '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    quoteAmount: {
        type: Number,
        default: null
    },
    quoteStatus: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: null
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    collection: 'bookings',
    versionKey: false
});

module.exports = mongoose.model('Booking', bookingSchema);