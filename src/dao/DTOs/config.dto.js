export class ProductDto {
    constructor(product) {
    this._id = product._id;
    this.title = product.title;
    this.category = product.category;
    this["title/category"] = `${product.title} / ${product.category}`;
    this.description = product.description;
    this.price = product.price;
    this.thumbnail = product.thumbnail;
    this.stock = product.stock;
    this.__v = product.__v;
    this.owner = product.owner;
    }
    }


export class UserDto {
constructor(user) {
this._id = user._id;
this.firstName = user.firstName;
this.lastName = user.lastName;
this.age = user.age;
this.email = user.email;
this.role = user.role;
this.carts = user.carts;
this.documents = user.documents;
this.lastConnection = user.lastConnection;
}
}