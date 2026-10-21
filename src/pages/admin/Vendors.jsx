import { useEffect, useState } from 'react'
import VendorTable from '../../components/VendorTable'
import { listenToVendors, updateVendorLicenseStatus } from '../../services/vendorService'
import { useToast } from '../../components/Toast'

export default function Vendors() {
  const [vendors, setVendors] = useState({})
  const toast = useToast()

  useEffect(() => listenToVendors(setVendors), [])

  const handleStatusChange = async (vendorId, status) => {
    try {
      await updateVendorLicenseStatus(vendorId, status)
      toast.success(`Vendor ${status === 'VERIFIED' ? 'verified' : 'rejected'}.`)
    } catch (err) {
      toast.error(err.message || 'Could not update vendor status.')
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {Object.keys(vendors).length} registered recycling / resource-recovery partner{Object.keys(vendors).length === 1 ? '' : 's'}.
      </p>
      <VendorTable vendors={vendors} onStatusChange={handleStatusChange} />
    </div>
  )
}
