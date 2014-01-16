var _ = require('underscore');

module.exports = function getProperty(obj, propertyName) {
	var property;
	if (_.isString(propertyName)) {
		propertyName = propertyName.split('.');
	}

	var currentContext = propertyName[0];
	for (var key in obj) if (obj.hasOwnProperty(key)) {
		if (key !== currentContext) {
			continue;
		}

		if (propertyName.length == 1) {
			return obj[key];
		} else if (isPlainObject(obj[key])) {
			return getProperty(obj[key], nonDestructiveShift(propertyName));
		}
	}
};

function nonDestructiveShift (arr) {
	var newArr = [];
	for (var i = 1; i < arr.length; i++) {
		newArr.push(arr[i]);
	}
	return newArr;
}

function isPlainObject (obj) {
	return _.isObject(obj) && !_.isArray(obj) && !_.isFunction(obj);
}