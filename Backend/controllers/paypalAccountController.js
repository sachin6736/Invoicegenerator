import PaypalAccount from '../Models/PaypalAccount.js';

// Add new PayPal account
// controllers/paypalAccountController.js
export const addPaypalAccount = async (req, res) => {
  try {
    const { accountName, clientId, secretKey, isSandbox = false } = req.body;

    // Basic validation
    if (!accountName?.trim() || !clientId?.trim() || !secretKey?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account name, Client ID and Secret Key are required' 
      });
    }

    // Check if an account with the same name already exists for this user
    const existingAccount = await PaypalAccount.findOne({
      userId: req.userId,
      accountName: accountName.trim()
    });

    if (existingAccount) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this name already exists' 
      });
    }

    // Count existing accounts to decide if this should be default
    const accountCount = await PaypalAccount.countDocuments({ userId: req.userId });

    const newAccount = await PaypalAccount.create({
      userId: req.userId,
      accountName: accountName.trim(),
      clientId: clientId.trim(),
      secretKey: secretKey.trim(),
      isSandbox,
      isDefault: accountCount === 0,   // First account becomes default automatically
    });

    res.status(201).json({
      success: true,
      message: 'PayPal account added successfully',
      account: {
        _id: newAccount._id,
        accountName: newAccount.accountName,
        clientId: newAccount.clientId,
        isSandbox: newAccount.isSandbox,
        isDefault: newAccount.isDefault,
      },
    });
  } catch (error) {
    console.error('Add PayPal Account Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add PayPal account. Please try again.' 
    });
  }
};
// Get all accounts (without secretKey)
export const getPaypalAccounts = async (req, res) => {
  try {
    const accounts = await PaypalAccount.find({ userId: req.userId })
      .select('accountName clientId isSandbox isDefault')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({ success: true, accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set account as default
export const setDefaultAccount = async (req, res) => {
  try {
    const { id } = req.params;

    await PaypalAccount.updateMany({ userId: req.userId }, { isDefault: false });

    const account = await PaypalAccount.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { isDefault: true },
      { new: true }
    );

    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    res.json({ success: true, message: 'Default account updated', account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};