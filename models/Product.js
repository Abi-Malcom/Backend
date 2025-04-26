const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be at least 0'],
    max: [100000, 'Price cannot exceed 100000']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        'Animal-Products',
        'Bioproducts',
        'Crop-Products',
        'Value-Added-Products'
      ],
      message: 'Please select a valid category'
    }
  },
  subcategory: {
    type: String,
    required: [true, 'Product subcategory is required']
  },
  images: {
    type: [String],
    required: [true, 'At least one image is required'],
    validate: {
      validator: function(images) {
        return images.length > 0;
      },
      message: 'At least one image is required'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true
      },
      comment: {
        type: String,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Additional fields for agricultural products
  harvestDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  organic: {
    type: Boolean,
    default: false
  },
  certifications: {
    type: [String]
  },
  weight: {
    type: Number,
    required: function() {
      return this.category !== 'Service';
    }
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'lb', 'piece', 'liter', 'packet'],
    default: 'kg'
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create text index for search functionality
productSchema.index({ 
  name: 'text', 
  description: 'text',
  category: 'text',
  subcategory: 'text'
});

module.exports = mongoose.model('Product', productSchema);