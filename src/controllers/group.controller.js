import Group from "../models/group.model.js";
import cloudinary from "../lib/cloudinary.js";
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members || members.length === 0) {
      return res.status(400).json({ message: "Name and members required" });
    }

    const group = await Group.create({
      name,
      members: [...members, req.user._id],
      admin: req.user._id,
    });

    res.status(201).json(group);
  } catch (error) {
    console.log("createGroup error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
    });

    res.status(200).json(groups);
  } catch (error) {
    console.log("getGroups error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { name, groupPic } = req.body;
    const groupId = req.params.id;

    let updateData = {};

    if (name) updateData.name = name;

    
    if (groupPic) {
      const upload = await cloudinary.uploader.upload(groupPic, {
        folder: "groups",
      });

      updateData.groupPic = upload.secure_url;
    }

    const group = await Group.findByIdAndUpdate(
      groupId,
      updateData,
      { new: true }
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.log("UPDATE GROUP ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};