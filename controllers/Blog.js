import Blog from "../models/Blog.js";
import StatusCodes from "http-status-codes";
import mongoose from "mongoose";
import Error from "../errors/index.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

//Get all published blogs that can be accessed by both logged in and logged out users
export const getAllPublishedBlogs = async (req, res) => {
  const { page } = req.query;
  const LIMIT = 20;
  const startIndex = (Number(page) - 1) * LIMIT;
  const total = await Blog.countDocuments({});
  try {
    const publishedBlog = await Blog.find({})
      .sort({ read_count: -1, reading_time: -1, timestamp: -1 })
      .limit(LIMIT)
      .skip(startIndex)
      .where("state")
      .equals("published");
    res.status(StatusCodes.OK).json({
      data: publishedBlog,
      currentPage: Number(page),
      NumberOfPages: Math.ceil(total / LIMIT),
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "No published blogs" });
  }
};

//Get all searchable published blog that can be accessed by both logged in and logged out users
export const getAllSearchPublishedBlogs = async (req, res) => {
  const { searchQuery, tags, user } = req.query;

  const title = new RegExp(searchQuery, "i");
  const author = new RegExp(user, "i");
  const blogs = await Blog.find({
    $or: [{ title }, { tags: { $in: tags.split(",") } }, { author }],
  })
    .where("state")
    .equals("published");
  res.status(200).json({
    data: blogs,
  });
};

//get single publish blog
export const getSinglePublishBlog = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(StatusCodes.NOT_FOUND).send(`No blog with id: ${_id}`);
  }

  try {
    const blog = await Blog.findById(_id).where("state").equals("published");
    res.status(200).json({ blog });
  } catch (error) {
    res.status(404).json({ msg: "No blog matches this" });
  }
};

// create blog
export const createBlog = async (req, res) => {
  const blog = req.body;

  const { title, description, body, tags } = blog;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ msg: "Authentication is not correct" });
  }
  const token = authHeader.split(" ")[1];

  let decodedData = "";
  if (token !== undefined || token !== null) {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    decodedData = decodedData?.id;
  }

  try {
    if (decodedData === undefined || decodedData === null) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid User or no user signed in yet" });
    }
    if (title === "" || description === "" || body === "" || tags === "") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Incomplete fields" });
    } else {
      const newBlog = new Blog({
        ...blog,
        author: decodedData,
        createdAt: new Date().toISOString(),
      });
      await newBlog.save();
      res.status(StatusCodes.CREATED).json({ newBlog });
    }
  } catch (error) {
    res
      .status(StatusCodes.CONFLICT)
      .json({ msg: "New blog cannot be created. try again" });
  }
};

//Get all draft blogs
export const getAllDraftBlogs = async (req, res) => {
  try {
    const draftBlog = await Blog.find({}).where("state").equals("draft");
    res.status(StatusCodes.OK).json({ data: draftBlog });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "No draft blogs" });
  }
};

//Update blog in draft state to published state
export const updateDraftToPublishedBlog = async (req, res) => {
  const { id: _id } = req.params;
  const blog = req.body;

  const { state } = blog;

  if (state === "") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "state field is empty." });
  }

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(StatusCodes.NOT_FOUND).send(`No blog with id: ${_id}`);
  } else {
    const updatedBlog = await Blog.findByIdAndUpdate(
      _id,
      { ...blog, state },
      {
        new: true,
        runValidators: true,
      }
    )
      .where("state")
      .equals("draft");
    res.status(200).json(updatedBlog);
  }
};

//edit draft
export const editDraftBlog = async (req, res) => {
  const { id: _id } = req.params;
  const blog = req.body;
  const { title, tags, description, body } = blog;

  if (title === "" || description === "" || body === "" || tags === "") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Incomplete fields" });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(StatusCodes.NOT_FOUND).send(`No blog with id: ${_id}`);
  } else {
    const updatedBlog = await Blog.findByIdAndUpdate(
      _id,
      { title, tags, description, body },
      {
        new: true,
        runValidators: true,
      }
    )
      .where("state")
      .equals("draft");
    res.status(200).json(updatedBlog);
  }
};

//Edit blog in published state
export const editPublishedBlog = async (req, res) => {
  const { id: _id } = req.params;
  const blog = req.body;
  const { title, tags, description, body } = blog;

  if (title === "" || description === "" || body === "" || tags === "") {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "Incomplete fields" });
    return;
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(StatusCodes.NOT_FOUND).send(`No blog with id: ${_id}`);
  } else {
    const updatedBlog = await Blog.findByIdAndUpdate(
      _id,
      { title, tags, description, body },
      {
        new: true,
        runValidators: true,
      }
    )
      .where("state")
      .equals("published");
    res.status(200).json(updatedBlog);
  }
};

//Delete draft blog
export const deleteDraftBlog = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(StatusCodes.BAD_REQUEST).send(`No blog with id: ${_id}`);
  } else {
    await Blog.findByIdAndDelete(_id).where("state").equals("draft");
  }
  res.status(StatusCodes.OK).send("Draft blog was deleted Successfully");
};

//Delete published blog
export const deletePublishedBlog = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(StatusCodes.BAD_REQUEST).send(`No blog with id: ${_id}`);
  } else {
    await Blog.findByIdAndDelete(_id).where("state").equals("published");
  }
  res.status(StatusCodes.OK).send("Draft blog was deleted Successfully");
};

//Get specific author blog
export const getUserBlogs = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({ msg: "Authentication is not correct" });
  }
  const token = authHeader.split(" ")[1];

  let decodedData = "";
  if (token !== undefined || token !== null) {
    decodedData = jwt.verify(token, process.env.JWT_SECRET);
    decodedData = decodedData?.id;
  }

  const { page } = req.query;
  const LIMIT = 20;
  const startIndex = (Number(page) - 1) * LIMIT; // get the starting index of the page
  const total = await Blog.countDocuments({});

  try {
    if (decodedData === undefined || decodedData === null) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid User or no user signed in yet" });
    }
    const blogData = await Blog.find({ author: decodedData })
      .limit(LIMIT)
      .skip(startIndex);
    res.status(StatusCodes.OK).json({
      data: blogData,
      currentPage: Number(page),
      NumberOfPages: Math.ceil(total / LIMIT),
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ msg: "No available blogs" });
  }
};
