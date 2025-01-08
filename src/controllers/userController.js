import User from "../models/user";
import bcrypt from "bcrypt";
import fetch from "node-fetch";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });

export const postJoin = async (req, res) => {
  const { name, username, email, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Password confirmation does not match."
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });

  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "this username/email is already taken"
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      password2,
      location
    });
    return res.redirect("/login");
  } catch (error) {
    console.log("error", error);

    return res.status(400).render("join", {
      pageTitle: "Join",
      errorMessage: error.message
    });
  }
};
export const getLogin = async (req, res) => {
  return res.render("login", { pageTitle: "Login" });
};

export const postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
  const pageTitle = "Login";
  console.log("req.body", req.body);

  const newUser = await User.findOne({ username });
  if (!newUser) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "An account with this username does not exists."
    });
  }
  const ok = await bcrypt.compare(password, newUser.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "Wrong password."
    });
  }
  req.session.loggedIn = true;
  req.session.user = newUser;
  await req.session.save();
  return res.redirect("/");
  } catch (error) {
    console.log("Login error:", error);
    return res.status(500).render("login", {
      pageTitle,
      loggedIn: Boolean(req.session.loggedIn),
      loggedInUser:req.session.user,
      errorMessage: "An error occured during login"
    })
  }
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email"
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiURL = "https://api.github.com/";

    const userData = await (
      await fetch(`${apiURL}/user`, {
        headers: {
          Authorization: `token ${access_token}`
        }
      })
    ).json();
    console.log(userData);
    try {
      const emailData = await (
        await fetch(`${apiURL}/user/emails`, {
          headers: {
            Authorization: `token ${access_token}`
          }
        })
      ).json(); 
      if (!Array.isArray(emailData)) {
        console.log("Email data is not an array:", emailData); 
        return res.redirect("/login")
    } 
    } catch (error) {
      console.log("Error fetching email data:", error); 
      return res.edirecr("/login")
    }
    
    
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        name: userData.name,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location
      });
  
    }
    
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};
export const getEdit = (req, res) => {
  return res.render("editProfile", { pageTitle: "Edit Profile" });
};
export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl }
    },
    body: { name, email, username, location },
    file
  } = req;
  await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.path : avatarUrl,
      name,
      email,
      username,
      location
    },
    file
  );
  req.session.user = {
    ...req.session.user,
    name,
    email,
    username,
    location
  };
  return res.render("editProfile");
};

export const getChangedPassword = (req, res) => {
  console.log("getChangedPassword");
  
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Can't change password for social login");
    return res.redirect("/");
  }
  return res.render("changePassword", { pageTitle: "Change Password" });
};

export const postChangedPassword = async (req, res) => {
  console.log("postChangedPassword");
  const {
    user: { _id }
  } = req.session;
  const { oldPassword, newPassword, newpassword1 } = req.body;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The current password is incorrect"
    });
  }
  if (newPassword !== newpassword1) {
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
      errorMessage: "The new password doesn't Match the confirmation"
    });
  }

  user.password = newPassword;
  await user.save();
  req.flash("info", "Password updated successfully");
  return res.redirect("/users/logout");
  //   return res.redirect("/logout");
};

export const logout = (req, res) => {
  req.flash("info", "logged out successfully");
  req.session.destroy();
  return res.redirect("/");
};

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("videos");
  if (!user) {
    return res.status(404).render("Page not found!!");
  }
  return res.render("profile", { pageTitle: `{user.name}'s Profile`, user });
};
