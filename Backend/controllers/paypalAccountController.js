import PaypalAccount from '../Models/PaypalAccount.js';

// Add new PayPal account
export const addPaypalAccount = async (req, res) => {
  try {
    const { accountName, clientId, secretKey, isSandbox = false } = req.body;

    if (!accountName || !clientId || !secretKey) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newAccount = await PaypalAccount.create({
      userId: req.userId,
      accountName: accountName.trim(),
      clientId: clientId.trim(),
      secretKey: secretKey.trim(),
      isSandbox,
      isDefault: false,
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
    res.status(500).json({ success: false, message: error.message });
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