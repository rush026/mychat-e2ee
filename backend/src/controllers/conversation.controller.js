import * as conversationService from '../services/conversation.service.js';
import ApiResponse from '../utils/ApiResponse.js';

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getConversations(req.user._id);
    res.json(ApiResponse.success('Conversations retrieved', { conversations }));
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.createOrGetConversation(
      req.user._id,
      req.body.participantId
    );
    res.status(201).json(ApiResponse.success('Conversation created', { conversation }));
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.createOrGetConversation(
      req.user._id,
      req.params.id
    );
    res.json(ApiResponse.success('Conversation details', { conversation }));
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    await conversationService.deleteConversation(req.params.id, req.user._id);
    res.json(ApiResponse.success('Conversation deleted'));
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { limit, before } = req.query;
    const { messages, hasMore } = await conversationService.getMessages(
      req.params.id,
      req.user._id,
      { limit: parseInt(limit) || 50, before }
    );
    res.json(ApiResponse.success('Messages retrieved', { messages }, { hasMore }));
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const message = await conversationService.sendMessage(
      req.params.id,
      req.user._id,
      req.body
    );
    res.status(201).json(ApiResponse.success('Message sent', { message }));
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    await conversationService.deleteMessage(req.params.id, req.user._id);
    res.json(ApiResponse.success('Message deleted'));
  } catch (error) {
    next(error);
  }
};
