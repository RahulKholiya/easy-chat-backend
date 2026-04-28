import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { model } from "../lib/gemini.js";
import crypto from "crypto";
import { encryptMessage, decryptMessage } from "../lib/encryption.js";

// OLD AES 
const SECRET_KEY = "1234567890123456";

const encrypt = (text) => {
  if (!text) return "";
  const cipher = crypto.createCipheriv(
    "aes-128-ecb",
    Buffer.from(SECRET_KEY),
    null
  );
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

const decrypt = (text) => {
  if (!text) return "";
  const decipher = crypto.createDecipheriv(
    "aes-128-ecb",
    Buffer.from(SECRET_KEY),
    null
  );
  let decrypted = decipher.update(text, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

// USERS
export const getUsersForSidebar = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.log("getUsers error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  GET MESSAGES
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    let messages;

    if (req.query.type === "group") {
      messages = await Message.find({ groupId: id })
        .populate("senderId", "fullName profilePic");
    } else {
      messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: id },
          { senderId: id, receiverId: myId },
        ],
      }).populate("senderId", "fullName profilePic");
    }

    // DECRYPT 
    const decryptedMessages = messages.map((msg) => ({
      ...msg._doc,
      text: (() => {
        const text = msg.text;

        // If already normal text → return directly
        if (!text || text.length < 20) {
          return text;
        }

        try {
          return decryptMessage(text); // new AES
        } catch {
          try {
            return decrypt(text); // old AES
          } catch {
            return text; // fallback plain
          }
        }
      })(),
    }));

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.log("getMessages error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, groupId } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl = null;
    let audioUrl = null;

    

if (image) {
  // 🔥 If already encrypted, store directly
  if (image.startsWith("U2FsdGVk")) {
    // AES encrypted string (CryptoJS signature)
    imageUrl = image;
  } else {
    // normal image → upload
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageUrl = uploadResponse.secure_url;
  }
}

    if (audio) {
      const upload = await cloudinary.uploader.upload(audio, {
        resource_type: "video",
      });
      audioUrl = upload.secure_url;
    }

    // AI
    let aiResponse = null;

    if (text && text.startsWith("@ai")) {
      try {
        const prompt = text.replace("@ai", "").trim();

        const result = await model.generateContent(prompt);
        const response = await result.response;

        aiResponse = response.text();
      } catch (err) {
        console.log("AI ERROR:", err.message);
        aiResponse = "⚠️ AI unavailable";
      }
    }

    // ENCRYPT MESSAGE 
    const encryptedText = encryptMessage(text);

    const newMessage = new Message({
      senderId,
      receiverId: groupId ? null : receiverId,
      groupId: groupId || null,
      text: encryptedText,
      image: imageUrl,
      audio: audioUrl,
    });

    await newMessage.save();

    const sender = await User.findById(senderId).select("_id fullName profilePic");

    const messageToSend = {
      ...newMessage._doc,
      senderId: sender,
      text: text, // send plain text to frontend
    };

    // USER CHAT
    if (!groupId) {
      const receiverSocketId = getReceiverSocketId(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", messageToSend);
      }


      const senderSocketId = getReceiverSocketId(senderId);

      if (senderSocketId) {
        io.to(senderSocketId).emit("newMessage", messageToSend);
      }
    } else {
      // GROUP CHAT
      io.to(groupId).emit("newMessage", messageToSend);
    }

    //  AI MESSAGE
    if (aiResponse) {
      const aiMessage = new Message({
        senderId,
        receiverId: groupId ? null : senderId,
        groupId: groupId || null,
        text: encryptMessage(aiResponse), // encrypt AI
        isAI: true,
      });

      await aiMessage.save();

      const formattedAIMessage = {
        ...aiMessage._doc,
        senderId: {
          fullName: "EMO ",
          profilePic: "/emo.png",
        },
        text: aiResponse,
      };

      if (!groupId) {
        const senderSocketId = getReceiverSocketId(senderId);

        ```
if (senderSocketId) {
  io.to(senderSocketId).emit("newMessage", formattedAIMessage);
}
```

      } else {
        io.to(groupId).emit("newMessage", formattedAIMessage);
      }
    }


    // SINGLE RESPONSE
    res.status(201).json(messageToSend);

  } catch (error) {
    console.log("sendMessage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE MESSAGE
export const deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.log("deleteMessage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// CLEAR CHAT
export const clearChat = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: id },
        { senderId: id, receiverId: myId },
      ],
    });

    res.status(200).json({ message: "Chat cleared" });
  } catch (error) {
    console.log("clearChat error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};