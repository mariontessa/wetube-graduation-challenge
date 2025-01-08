import Video from "../models/video";
import User from "../models/user";
import Comment from "../models/comment";
import path from "path";

export const home = async (req, res) => {
  try {
    const videos = await Video.find({})
      .sort({ createdAt: "desc" })
      .populate("owner");
    // console.log("req.session", req.session);
    console.log("videos", videos);
    return res.render("home", {
      pageTitle: "Home",
      videos,
      loggedInUser: req.session.user
    });
  } catch (error) {
    console.log("Home page error:", error);
    return res.status(500).render("server-error");
  }
};
export const see = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id)
      .populate("owner")
      .populate("comments");

    if (!video) {
      return res
        .status(404)
        .render("404", { pageTitle: "Video not found, sorry!" });
    }

    return res.render("watch", { pageTitle: video.title, video });
  } catch (error) {
    console.log("video view error:", error);
    return res.status(500);
  }
};

export const getEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user: { _id }
    } = req.session;
    const video = await Video.findById(id);
    if (!video) {
      return res.render("404", { pageTitle: "Video not found, sorry!" });
    }
    if (String(video.owner) !== String(_id)) {
      req.flash("error", "Not authorized");
      return res.status(403).redirect("/");
    }
    return res.render("edit", { pageTitle: `Edit: ${video.title}`, video });
  } catch (error) {
    console.log("Get edit error:", error);
    return res.status(500);
  }
};
export const postEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, hashtags } = req.body;
    const video = await Video.findById(id);
    if (!video) {
      return res
        .status(404)
        .render("404", { pageTitle: "Video not found, sorry!" });
    }
    await Video.findByIdAndUpdate(id, {
      title,
      description,
      hashtags: Video.formatHashtags(hashtags)
    });
    req.flash("success", "Changes Saved");
    return res.redirect(`/videos/${id}`);
  } catch (error) {
    console.log("Post edit error:", error);
    return res.status(500);
  }
};
export const getUpload = (req, res) => {
  return res.render("upload", {
    pageTitle: "Upload Video",
    errorMessage: "error._message"
  });
};

export const postUpload = async (req, res) => {
  console.log("postUpload");

  const {
    user: { _id }
  } = req.session;
  console.log(req.file);

  const { path: fileUrl } = req.file;
  const { title, description, hashtags } = req.body;

  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags)
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    await user.save();
    await newVideo.save();

    req.flash("success", "Video uploaded successfully");
    return res.redirect("/");
  } catch (error) {
    console.log("error", error);

    return res.status(400).render("upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id }
  } = req.session;
  const video = await Video.findById(id);
  if (!video) {
    return res
      .status(404)
      .render("404", { pageTitle: "Video not found, sorry!" });
  }
  if (String(video.owner) !== String(_id)) {
    req.flash("error", "Not authorized");
    return res.status(403).redirect("/");
  }
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};
export const search = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.render("search", {
        pageTitle: "Search",
        videos: []
      });
    }
    const videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "1")
      }
    }).populate("owner");
    return res.render("search", { pageTitle: "Search Results", videos });
  } catch (error) {
    console.log("search error:", error);
    return res.status(500);
  }
};

export const registerView = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(400);
  }
  video.meta.views += 1;
  await video.save();
  return res.sendStatus(200);
};

export const createComment = async (req, res) => {
  const {
    session: { user },
    body: { text },
    params: { id }
  } = req;
  console.log(user, text, id);

  const video = await Video.findById(id);

  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id
  });
  video.comments.push(comment._id);
  video.save();
  return res.json({ newCommentId: comment._id });
};
