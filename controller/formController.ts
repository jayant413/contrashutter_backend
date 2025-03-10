import { Request, Response } from "express";
import { Form } from "../models/formModel";
import Event from "../models/event";
// Update or create a form
export const createForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventType, fields, formTitle } = req.body;

    // Validate required fields
    if (!eventType || !fields || !Array.isArray(fields)) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if a form already exists for the given eventType
    const existingForm = await Form.findOne({ eventType });

    if (existingForm) {
      // Update the existing form
      existingForm.fields = fields;
      existingForm.formTitle = formTitle;
      const updatedForm = await existingForm.save();

      res.status(200).json({
        success: true,
        data: updatedForm,
      });
    } else {
      // Create new form
      const form = new Form({
        eventType,
        formTitle,
        fields,
      });

      await form.save();

      const event = await Event.findByIdAndUpdate(eventType, {
        formId: form._id,
      });

      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }

      await event.save();
      res.status(201).json({
        success: true,
        data: form,
      });
    }
  } catch (error) {
    console.error("Error creating form:", error);
    res.status(500).json({
      success: false,
      message: "Error creating form",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update an existing form
export const updateForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { formId } = req.params;
    const { fields } = req.body;

    if (!fields || !Array.isArray(fields)) {
      res.status(400).json({ message: "Invalid fields data" });
      return;
    }

    const updatedForm = await Form.findByIdAndUpdate(
      formId,
      { fields },
      { new: true }
    );

    if (!updatedForm) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedForm,
    });
  } catch (error) {
    console.error("Error updating form:", error);
    res.status(500).json({
      success: false,
      message: "Error updating form",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get form by event type
export const getFormByEventType = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventType } = req.params;

    const form = await Form.findOne({ eventType });

    if (!form) {
      res.status(404).json({ message: "Form not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching form",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
