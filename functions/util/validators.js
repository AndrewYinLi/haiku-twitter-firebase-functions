// returns true if blank string, else false
const isEmptyStr = string => {
  if (string.trim() === "") {
    return true;
  }
  return false;
};

// returns true if valid email, else false
const isValidEmail = email => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) {
    return true;
  }
  return false;
};

exports.validateSignup = newUser => {
  let errors = {};

  // validate email
  if (isEmptyStr(newUser.email)) {
    errors.email = "Must not be empty";
  } else if (!isValidEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  // validate password
  if (isEmptyStr(newUser.password)) {
    errors.password = "Must not be empty";
  } else if (newUser.password !== newUser.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  // validate userHandle
  if (isEmptyStr(newUser.userHandle)) {
    errors.userHandle = "Must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateLogin = user => {
  let errors = {};

  if (isEmptyStr(user.email)) {
    errors.email = "Must not be empty";
  }
  if (isEmptyStr(user.password)) {
    errors.password = "Must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.reduceUserDetails = data => {
  let userDetails = {};

  if (!isEmptyStr(data.bio.trim())) {
    userDetails.bio = data.bio;
  }
  if (!isEmptyStr(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== "http") {
      userDetails.website = `http://${data.website.trim()}`;
    } else {
      userDetails.website = data.website;
    }
  }
  if (!isEmptyStr(data.location.trim())) {
    userDetails.location = data.location;
  }

  return userDetails;
};
