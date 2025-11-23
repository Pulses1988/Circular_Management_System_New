const circularTrackingModel = require('../models/circularTrackingModel');

exports.getUnseenCirculars = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const [rows] = await circularTrackingModel.getUnseenByEmployee(employeeId);
    res.json({ message: 'Unseen circulars fetched', data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch unseen circulars' });
  }
};

exports.getSeenCirculars=async(req,res)=>{
  try{
    const employeeId= req.params.employeeId;
    const[rows]=await circularTrackingModel.getSeenByEmployee(employeeId);
    res.json({massage: 'Senn Circulars fetched', data:rows});
  }catch(err){
    console.error(err);
    res.status(500).json({error:'failed to fetch seen circulars'})
  }
}

exports.markSeen = async (req, res) => {
  try {
    const { circularId, employeeId } = req.body;
    await circularTrackingModel.markAsSeen(circularId, employeeId);
    res.json({ message: 'Circular marked as seen' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark circular as seen' });
  }
};

exports.markCompleted = async (req, res) => {
  try {
    const { circularId, employeeId } = req.body;
    await circularTrackingModel.markAsCompleted(circularId, employeeId);
    res.json({ message: 'Circular marked as completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark circular as completed' });
  }
};

exports.getCompletionStatus = async (req, res) => {
  try {
    const { circularId, employeeId } = req.params;
    const [rows] = await circularTrackingModel.getCompletionStatus(circularId, employeeId);
    
    if (rows.length > 0) {
      res.json({ 
        is_completed: rows[0].is_completed,
        completed_at: rows[0].completed_at
      });
    } else {
      res.json({ is_completed: false, completed_at: null });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch completion status' });
  }
};
