/**
 * CSV Generator for Car Hive Freelancer Platform.
 * Programmatically generates realistic dummy vehicle listing data for a given range (e.g. "1-150").
 */

const generateVehicleDataCSV = (rangeString) => {
  if (!rangeString || !rangeString.includes('-')) {
    rangeString = '1-150';
  }
  const [startStr, endStr] = rangeString.split('-');
  const start = parseInt(startStr, 10) || 1;
  const end = parseInt(endStr, 10) || 150;
  
  const headers = [
    'Serial No',
    'Car Title',
    'Vehicle Type',
    'Seller Name',
    'Contact Number',
    'City',
    'State',
    'Pincode',
    'Fuel Type',
    'Year of Manufacturing',
    'Mileage (km)',
    'Transmission',
    'Engine Capacity (cc)',
    'Vehicle Color',
    'Chassis Number',
    'Asking Price',
    'Vehicle Description'
  ];
  
  const brands = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Skoda', 'Volkswagen', 'MG'];
  const models = {
    'Maruti Suzuki': ['Swift', 'Baleno', 'Brezza', 'Ertiga', 'Dzire', 'Alto'],
    'Hyundai': ['i20', 'Creta', 'Verna', 'Venue', 'Alcazar', 'Grand i10'],
    'Tata': ['Nexon', 'Altroz', 'Harrier', 'Safari', 'Punch', 'Tiago'],
    'Mahindra': ['Thar', 'XUV700', 'Scorpio-N', 'Bolero', 'XUV300'],
    'Honda': ['City', 'Amaze', 'Elevate', 'Civic'],
    'Toyota': ['Fortuner', 'Innova Hycross', 'Glanza', 'Urban Cruiser Taisor'],
    'Kia': ['Seltos', 'Sonet', 'Carens', 'Carnival'],
    'Skoda': ['Slavia', 'Kushaq', 'Superb', 'Octavia'],
    'Volkswagen': ['Virtus', 'Taigun', 'Tiguan'],
    'MG': ['Hector', 'Astor', 'ZS EV', 'Comet EV']
  };
  
  const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'EV'];
  const transmissions = ['Manual', 'Automatic'];
  const colors = ['White', 'Silver', 'Grey', 'Black', 'Red', 'Blue'];
  const cities = ['Chennai', 'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
  const states = {
    'Chennai': 'Tamil Nadu',
    'Bangalore': 'Karnataka',
    'Mumbai': 'Maharashtra',
    'Delhi': 'Delhi',
    'Hyderabad': 'Telangana',
    'Pune': 'Maharashtra',
    'Kolkata': 'West Bengal',
    'Ahmedabad': 'Gujarat'
  };
  
  const rows = [headers.join(',')];
  
  for (let i = start; i <= end; i++) {
    const brand = brands[i % brands.length];
    const modelList = models[brand];
    const model = modelList[i % modelList.length];
    const carTitle = `${brand} ${model}`;
    const vehicleType = i % 2 === 0 ? 'new' : 'used';
    const sellerName = `Seller ${i}`;
    const contactNumber = `98765${String(10000 + (i * 13) % 90000)}`;
    const city = cities[i % cities.length];
    const state = states[city];
    const pincode = String(600000 + (i * 17) % 99999);
    const fuelType = fuelTypes[i % fuelTypes.length];
    const year = 2018 + (i % 8);
    const mileage = vehicleType === 'new' ? '0' : String(12000 + (i * 750) % 80000);
    const transmission = transmissions[i % transmissions.length];
    const engineCapacity = String(998 + (i * 123) % 1500);
    const color = colors[i % colors.length];
    const chassisNumber = `CHAS${100000 + i * 29}`;
    const price = String(450000 + (i * 15000) % 1500000);
    const description = `This is a well-maintained ${year} ${carTitle} in ${color} color. Fuel type is ${fuelType} with ${transmission} transmission. Excellent condition.`;
    
    // Escaping helper for standard RFC 4180 CSV compliance
    const escapeCsv = (val) => {
      const s = String(val).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    
    const row = [
      i,
      escapeCsv(carTitle),
      vehicleType,
      escapeCsv(sellerName),
      contactNumber,
      escapeCsv(city),
      escapeCsv(state),
      pincode,
      fuelType,
      year,
      mileage,
      transmission,
      engineCapacity,
      color,
      chassisNumber,
      price,
      escapeCsv(description)
    ];
    
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
};

module.exports = { generateVehicleDataCSV };
