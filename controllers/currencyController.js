const Currency = require('../models/currencyModel');
const LoginModel = require('../models/LoginModel');

// Importing the service function to check if the user is verified
const { checkVerify } = require("../services/getConfigstoreInstance");

const currency = async (req, res) => {
    try {
        const currencyData = await Currency.findOne({})
        const selectedCurrency = currencyData ? currencyData.currency : "";

        return res.render('currency', { selectedCurrency });
    } catch (error) {
        console.error('Error fetching currency:', error);
    }
}

const currencydata = async (req, res) => {
    try {
        let loginData = await LoginModel.find({});
        for (let i in loginData) {
            if (String(loginData[i]._id) === req.session.userId) {
                
                if (loginData[i].is_admin == 1) {

                    const fetchCurrency = await Currency.find();
                    console.log(fetchCurrency)

                    if(fetchCurrency.length != 0){
                        const currencyData = await Currency.updateOne({ currency: req.body.currency });
                        if (currencyData) {
                            return res.redirect('/dashboard');
                        } else {
                            return res.redirect('back');
                        }
                    }

                    if(fetchCurrency.length == 0) {
                        const currencyData = new Currency({ currency: req.body.currency });
                        const saveCurrency = await currencyData.save();
                        if (saveCurrency) {
                            return res.redirect('/dashboard');
                        } else {
                            return res.redirect('back');
                        }
                    }
                    
                } else {
                    req.flash('error', 'You have no access to change currency , You are not super admin !! *');
                    return res.redirect('back');
                }
            }
        }
    } 
     catch (error) {
        console.error('Error fetching currency :', error);
    }
}

module.exports = {
    currency,
    currencydata
}