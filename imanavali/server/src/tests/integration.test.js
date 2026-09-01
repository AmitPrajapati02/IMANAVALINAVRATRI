require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const { getAreas, getPincodeByAreaId, getRegistrationCountByMobile } = require('../services/registration');
const { createOrder } = require('../services/razorpay');

(async () => {
  try {
    console.log('Testing DB connection...');
    const areas = await getAreas();
    console.log(`GetAreas: ${areas.length} areas`);
    if (areas.length) {
      const pin = await getPincodeByAreaId(areas[0].AreaId);
      console.log(`GetPincodeByAreaId(${areas[0].AreaId}): ${pin}`);
    }
    const count = await getRegistrationCountByMobile('9999999999|Male Donor Player');
    console.log(`sp_GetRegistrationCountByMobile: ${count}`);

    console.log('Testing Razorpay order create...');
    const order = await createOrder(500, 'TEST001');
    console.log(`Razorpay order: ${order.id}`);

    console.log('\nAll checks passed — registration through payment should work.');
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
})();
