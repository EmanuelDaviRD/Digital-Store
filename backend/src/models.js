import bcrypt from 'bcryptjs';
import { DataTypes } from 'sequelize';
import { sequelize } from './database.js';

export const User = sequelize.define(
  'User',
  {
    firstname: { type: DataTypes.STRING, allowNull: false },
    surname: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    password: { type: DataTypes.STRING, allowNull: false },
  },
  {
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: { attributes: {} } },
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) user.password = await bcrypt.hash(user.password, 12);
      },
    },
  }
);

export const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

export const Product = sequelize.define('Product', {
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  use_in_menu: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0 } },
  price_with_discount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  brand: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  state: { type: DataTypes.STRING },
});

export const ProductImage = sequelize.define('ProductImage', {
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  path: { type: DataTypes.STRING, allowNull: false },
});

export const ProductOption = sequelize.define('ProductOption', {
  title: { type: DataTypes.STRING, allowNull: false },
  shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: false, defaultValue: 'square' },
  radius: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  type: { type: DataTypes.ENUM('text', 'color'), allowNull: false, defaultValue: 'text' },
  values: { type: DataTypes.STRING, allowNull: false },
});

export const Order = sequelize.define('Order', {
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('paid', 'pending_payment', 'payment_failed'),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('pix', 'credit_card', 'boleto'),
    allowNull: false,
  },
  payment_scenario: {
    type: DataTypes.ENUM('approved', 'pending', 'rejected'),
    allowNull: false,
  },
  postal_code: { type: DataTypes.STRING(8), allowNull: false },
  shipping_address: { type: DataTypes.JSON, allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  shipping_cost: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

export const OrderItem = sequelize.define('OrderItem', {
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: true },
  product_name: { type: DataTypes.STRING, allowNull: false },
  product_image: { type: DataTypes.STRING, allowNull: false },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  line_total: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  selected_options: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
});

export const ProductCategory = sequelize.define(
  'ProductCategory',
  {
    product_id: { type: DataTypes.INTEGER, primaryKey: true },
    category_id: { type: DataTypes.INTEGER, primaryKey: true },
  },
  { timestamps: false }
);

Product.hasMany(ProductImage, { as: 'images', foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.hasMany(ProductOption, { as: 'options', foreignKey: 'product_id', onDelete: 'CASCADE' });
Product.belongsToMany(Category, {
  as: 'categories',
  through: ProductCategory,
  foreignKey: 'product_id',
  otherKey: 'category_id',
});
Category.belongsToMany(Product, {
  as: 'products',
  through: ProductCategory,
  foreignKey: 'category_id',
  otherKey: 'product_id',
});
User.hasMany(Order, { as: 'orders', foreignKey: 'user_id', onDelete: 'CASCADE' });
Order.belongsTo(User, { as: 'user', foreignKey: 'user_id' });
Order.hasMany(OrderItem, { as: 'items', foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { as: 'order', foreignKey: 'order_id' });

export const productIncludes = [
  { model: ProductImage, as: 'images', where: { enabled: true }, required: false },
  { model: ProductOption, as: 'options', required: false },
  { model: Category, as: 'categories', through: { attributes: [] }, required: false },
];
