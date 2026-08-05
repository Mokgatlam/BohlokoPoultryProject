const { v4: uuidv4 } = require('uuid');

class BaseRepository {
  constructor(collection) {
    this.collection = collection;
  }

  async create(data) {
    const doc = {
      _id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await this.collection.insert(doc);
    return doc;
  }

  async find(query = {}, options = {}) {
    let cursor = this.collection.find(query);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    return await cursor.exec();
  }

  async findOne(query) {
    return await this.collection.findOne(query);
  }

  async findById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await this.collection.update({ _id: id }, { $set: updates });
    return await this.collection.findOne({ _id: id });
  }

  async update(query, updates) {
    updates.updatedAt = new Date();
    return await this.collection.update(query, { $set: updates }, { multi: true });
  }

  async delete(query) {
    return await this.collection.remove(query, { multi: true });
  }

  async deleteById(id) {
    return await this.collection.remove({ _id: id });
  }

  async count(query = {}) {
    return await this.collection.count(query);
  }
}

module.exports = BaseRepository;
