// Define a collection to hold our tasks
Tasks = new Mongo.Collection('tasks');

Tasks.allow({
  insert: function (userId, doc) {
    return true; // alan puts the cart before the horse
    // the user must be logged in, and the document must be owned by the user
    return (userId && doc.owner === userId);
  },
  update: function (userId, doc, fields, modifier) {
    // can only change your own documents
    return doc.owner === userId;
  },
  remove: function (userId, doc) {
    // can only remove your own documents
    return doc.owner === userId;
  },
  fetch: ['owner']
});
