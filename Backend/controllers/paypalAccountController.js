import PaypalAccount from '../Models/PaypalAccount.js';

// controllers/paypalAccountController.js
// Add new PayPal account

export const addPaypalAccount = async (req, res) => {
  try {
    let { accountName, clientId, secretKey, isSandbox = false } = req.body;

    // ✅ Clean the values properly
    accountName = accountName?.trim();
    clientId = clientId?.trim().replace(/\s+/g, '');     // Remove all whitespaces
    secretKey = secretKey?.trim().replace(/\s+/g, '');

    if (!accountName || !clientId || !secretKey) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account name, Client ID and Secret Key are required' 
      });
    }

    // Extra validation for length
    if (clientId.length < 50) {
      return res.status(400).json({ success: false, message: 'Invalid Client ID' });
    }
    if (secretKey.length < 50) {
      return res.status(400).json({ success: false, message: 'Invalid Secret Key' });
    }

    const existingAccount = await PaypalAccount.findOne({
      userId: req.userId,
      accountName: accountName
    });

    if (existingAccount) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this name already exists' 
      });
    }

    const accountCount = await PaypalAccount.countDocuments({ userId: req.userId });

    const newAccount = await PaypalAccount.create({
      userId: req.userId,
      accountName,
      clientId,
      secretKey,
      isSandbox,
      isDefault: accountCount === 0,
    });

    res.status(201).json({
      success: true,
      message: 'PayPal account added successfully',
      account: {
        _id: newAccount._id,
        accountName: newAccount.accountName,
        clientId: newAccount.clientId.substring(0, 15) + '...', // Safe display
        isSandbox: newAccount.isSandbox,
        isDefault: newAccount.isDefault,
      },
    });
  } catch (error) {
    console.error('Add PayPal Account Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add PayPal account' });
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

// Delete PayPal Account
export const deletePaypalAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await PaypalAccount.findOne({ 
      _id: id, 
      userId: req.userId 
    });

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Prevent deleting the default account
    if (account.isDefault) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete default account. Please set another account as default first.' 
      });
    }

    await PaypalAccount.findByIdAndDelete(id);

    res.json({ 
      success: true, 
      message: 'PayPal account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete PayPal Account Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
};