import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTruck, FiSend } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { adAPI } from '../../utils/api';
import { PageHeader, Card, Input, Select, Textarea, Button } from '../../components/common/UI';

// Field definitions per vehicle type. type: 'text' | 'select' | 'textarea' | 'checkbox'
const NEW_FIELDS = [
  { name: 'sellerName', label: 'Seller Name' },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
  { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'] },
  { name: 'yearOfProduction', label: 'Year of Production' },
  { name: 'yearOfManufacturing', label: 'Year of Manufacturing' },
  { name: 'bodyType', label: 'Body Type', type: 'select', options: ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Coupe', 'Convertible', 'Pickup', 'Van'] },
  { name: 'mileageKm', label: 'Mileage (KM)' },
  { name: 'transmissionType', label: 'Transmission Type', type: 'select', options: ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'] },
  { name: 'engineCapacityCc', label: 'Engine Capacity (CC)' },
  { name: 'vehicleColor', label: 'Vehicle Color' },
  { name: 'colorCode', label: 'Color Code' },
  { name: 'chassisNumber', label: 'Chassis Number' },
  { name: 'fuelEfficiency', label: 'Fuel Efficiency' },
  { name: 'roadTaxPaid', label: 'Road Tax Paid Status', type: 'select', options: ['Paid', 'Not Paid', 'Partial'] },
  { name: 'askingPrice', label: 'Asking Price' },
  { name: 'priceNegotiable', label: 'Price Negotiable', type: 'checkbox' },
];

const USED_FIELDS = [
  { name: 'carCode', label: 'Car Code' },
  { name: 'sellerName', label: 'Seller Name' },
  { name: 'address', label: 'Address' },
  { name: 'city', label: 'City' },
  { name: 'state', label: 'State' },
  { name: 'pincode', label: 'Pincode' },
  { name: 'contactNumber', label: 'Contact Number' },
  { name: 'emailAddress', label: 'Email Address', type: 'email' },
  { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG'] },
  { name: 'vehicleCondition', label: 'Vehicle Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Work'] },
  { name: 'yearOfProduction', label: 'Year of Production' },
  { name: 'yearOfManufacturing', label: 'Year of Manufacturing' },
  { name: 'bodyType', label: 'Body Type', type: 'select', options: ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Coupe', 'Convertible', 'Pickup', 'Van'] },
  { name: 'mileage', label: 'Mileage' },
  { name: 'transmissionType', label: 'Transmission Type', type: 'select', options: ['Manual', 'Automatic', 'AMT', 'CVT', 'DCT'] },
  { name: 'engineCapacity', label: 'Engine Capacity' },
  { name: 'vehicleColor', label: 'Vehicle Color' },
  { name: 'colorCode', label: 'Color Code' },
  { name: 'numberOfOwners', label: 'Number of Owners' },
  { name: 'registrationCity', label: 'Registration City' },
  { name: 'registrationNumber', label: 'Registration Number' },
  { name: 'vinNumber', label: 'VIN Number' },
  { name: 'chassisNumber', label: 'Chassis Number' },
  { name: 'insuranceValidity', label: 'Insurance Validity' },
  { name: 'rcStatus', label: 'RC Status', type: 'select', options: ['Available', 'Not Available', 'In Process'] },
  { name: 'warrantyStatus', label: 'Warranty Status', type: 'select', options: ['Active', 'Expired', 'None'] },
  { name: 'serviceHistoryStatus', label: 'Service History Status', type: 'select', options: ['Full', 'Partial', 'None'] },
  { name: 'lastServiceDate', label: 'Last Service Date', type: 'date' },
  { name: 'serviceCenterHistory', label: 'Service Center History', type: 'textarea', full: true },
  { name: 'featureHighlights', label: 'Feature Highlights', type: 'textarea', full: true },
  { name: 'carAccessories', label: 'Car Accessories', type: 'textarea', full: true },
  { name: 'fuelEfficiency', label: 'Fuel Efficiency' },
  { name: 'tyreCondition', label: 'Tyre Condition', type: 'select', options: ['Excellent', 'Good', 'Average', 'Needs Replacement'] },
  { name: 'interiorCondition', label: 'Interior Condition', type: 'select', options: ['Excellent', 'Good', 'Average', 'Poor'] },
  { name: 'exteriorCondition', label: 'Exterior Condition', type: 'select', options: ['Excellent', 'Good', 'Average', 'Poor'] },
  { name: 'roadTaxPaid', label: 'Road Tax Paid', type: 'select', options: ['Paid', 'Not Paid', 'Partial'] },
  { name: 'loanStatus', label: 'Loan Status', type: 'select', options: ['No Loan', 'Active Loan', 'Cleared'] },
  { name: 'askingPrice', label: 'Asking Price' },
  { name: 'financialStatus', label: 'Financial Status' },
  { name: 'vehicleDescription', label: 'Vehicle Description', type: 'textarea', full: true },
];

export default function PostAd() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState('used');
  const [common, setCommon] = useState({ batchNumber: '', carTitle: '' });
  const [details, setDetails] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const fields = vehicleType === 'new' ? NEW_FIELDS : USED_FIELDS;

  const setDetail = (name) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setDetails(d => ({ ...d, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!common.batchNumber || !common.carTitle) {
      toast.error('Batch number and car title are required.');
      return;
    }
    if (!confirmed) {
      toast.error('Please confirm the information is true and accurate.');
      return;
    }
    setLoading(true);
    try {
      const res = await adAPI.create({ ...common, vehicleType, confirmed, details });
      toast.success(res.data.message || 'Advertisement Submitted Successfully');
      navigate('/my-ads');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit advertisement.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (f) => {
    const common = { value: details[f.name] || '', onChange: setDetail(f.name), className: f.full ? 'sm:col-span-2 lg:col-span-3' : '' };
    if (f.type === 'select') {
      return (
        <Select key={f.name} label={f.label} {...common}>
          <option value="">Select…</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      );
    }
    if (f.type === 'textarea') {
      return <Textarea key={f.name} label={f.label} rows={3} {...common} />;
    }
    if (f.type === 'checkbox') {
      return (
        <label key={f.name} className="flex items-center gap-2 text-sm cursor-pointer mt-6" style={{ color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={!!details[f.name]} onChange={setDetail(f.name)} />
          {f.label}
        </label>
      );
    }
    return <Input key={f.name} label={f.label} type={f.type || 'text'} {...common} />;
  };

  return (
    <div>
      <PageHeader title="Post Advertisement" subtitle="Create a new vehicle advertisement" />
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-w-6xl">
        {/* Vehicle type toggle */}
        <Card>
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiTruck size={18} style={{ color: 'var(--neon)' }}/> Vehicle Type
          </h3>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {[{ k: 'new', t: 'New Vehicle' }, { k: 'used', t: 'Second-Hand Vehicle' }].map(opt => (
              <button type="button" key={opt.k} onClick={() => { setVehicleType(opt.k); setDetails({}); }}
                className="p-3 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: vehicleType === opt.k ? 'var(--neon)' : 'var(--border)',
                  background: vehicleType === opt.k ? 'rgba(59,130,246,0.1)' : 'var(--bg-surface)',
                  color: vehicleType === opt.k ? 'var(--neon-light)' : 'var(--text-secondary)'
                }}>
                {opt.t}
              </button>
            ))}
          </div>
        </Card>

        {/* Common fields */}
        <Card>
          <h3 className="font-display font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Advertisement Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Car Hive Batch Number" required value={common.batchNumber} onChange={e => setCommon(c => ({ ...c, batchNumber: e.target.value }))} />
            <Input label="Car Title" required value={common.carTitle} onChange={e => setCommon(c => ({ ...c, carTitle: e.target.value }))} />
            <Input label="Username" value={user?.username || user?.name || ''} disabled />
          </div>
        </Card>

        {/* Vehicle-specific fields */}
        <Card>
          <h3 className="font-display font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>
            {vehicleType === 'new' ? 'New Vehicle Information' : 'Second-Hand Vehicle Information'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(renderField)}
          </div>
        </Card>

        {/* Confirmation */}
        <Card>
          <label className="flex items-start gap-3 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-0.5" />
            <span>I hereby confirm that all the above information is true and accurate. I have checked every detail before submitting this advertisement.</span>
          </label>
        </Card>

        <Button type="submit" loading={loading} disabled={!confirmed} className="px-8 py-3 text-base">
          <FiSend size={16}/> POST AD
        </Button>
      </form>
    </div>
  );
}
