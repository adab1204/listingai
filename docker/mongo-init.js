// docker/mongo-init.js
// Runs once when MongoDB container is first created
db = db.getSiblingDB('listingai');

db.createUser({
  user: 'listingai_app',
  pwd:  'changeme_in_production',
  roles: [{ role: 'readWrite', db: 'listingai' }],
});

db.createCollection('users');
db.createCollection('subscriptions');
db.createCollection('generatedcontents');
db.createCollection('paymenthistories');

print('ListingAI database initialized.');
