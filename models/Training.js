const mongoose = require('mongoose')
const geocoder = require('../utils/geocoder')

const TrainingSchema = new mongoose.Schema(
    {
        _id: mongoose.Types.ObjectId,
        name: {
            type: String,
            required: [true, 'Please add a name'],
            unique: true,
            trim: true,
            maxlength: [50, 'Name can not be more than 50 characters!'],
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
            unique: true,
            trim: true,
            maxlength: [500, 'Description can not be more than 500 characters!'],
        },
        website: {
            type: String,
            match: [
                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                'Please use a valid URL with HTTP or HTTPS',
            ],
        },
        email: {
            type: String,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
        },
        address: {
            type: String,
            required: [true, 'Please add an address'],
        },
        location: {
            // GeoJSON Point
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
                index: '2dsphere',
            },
            formattedAddress: String,
            street: String,
            city: String,
            state: String,
            zipcode: String,
            country: String,
        },
        careers: {
            // Array of strings
            type: [String],
            required: true,
            enum: ['Web Development', 'Mobile Development', 'UI/UX', 'Data Science', 'Business', 'Other'],
        },
        averageRating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [10, 'Rating must can not be more than 10'],
        },
        totalCost: Number,
        photo: {
            type: String,
            default: 'no-photo.jpg',
        },
        housing: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

// A modell kidolgozása után használjuk a köztes szoftvert
// A mentés előtt fog lefutni
TrainingSchema.pre('save', async function (next) {
    const loc = await geocoder.geocode(this.address)
    this.location = {
        type: 'Point',
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].state,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode,
    } // Formázott címünk lesz, nincs szükség az eredeti címre
    this.address = undefined
    next()
})

// Kaszkádolt törlés, ha egy képzést törlünk, akkor az ahhoz tartozó kurzusok is törlődjenek
TrainingSchema.pre('remove', async function (next) {
    console.log(`Courses being removed from bootcamp ${this._id}`)
    await this.model('Course').deleteMany({ training: this._id })
    next()
})

// Fordított populate virtual segítségével
TrainingSchema.virtual('courses', {
    ref: 'Course',
    localField: '_id',
    foreignField: 'training',
    justOne: false,
})

TrainingSchema.pre('remove', async function (next) {
    console.log(`Courses being removed from bootcamp ${this._id}`)
    await this.model('Course').deleteMany({ training: this._id })
    next()
})

module.exports = mongoose.model('Training', TrainingSchema, 'trainings')
