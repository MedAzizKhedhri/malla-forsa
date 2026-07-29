const express = require('express');
const router = express.Router();
const { getLocations, createLocation, updateLocation, deleteLocation } = require('../controllers/locationController');

router.route('/')
  .get(getLocations)
  .post(createLocation);

router.route('/:id')
  .put(updateLocation)
  .delete(deleteLocation);

module.exports = router;
