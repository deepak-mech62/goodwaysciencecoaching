import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { StudentFeeRecord, FeePaymentReceipt } from '../types';
import { DEFAULT_STUDENT_FEES } from '../data/mockData';
import { 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Printer, 
  QrCode, 
  Building2, 
  Send, 
  FileText, 
  ChevronRight, 
  HelpCircle,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  Percent,
  Calendar,
  MessageCircle,
  Copy,
  Check,
  X,
  ArrowUpRight
} from 'lucide-react';
import { FeeReceiptModal } from './FeeReceiptModal';

interface StudentFeeViewProps {
  onNotifyToast?: (text: string, type: 'success' | 'warning' | 'info') => void;
}

export const StudentFeeView: React.FC<StudentFeeViewProps> = ({ onNotifyToast }) => {
  const { user, token } = useAuth();
  const [feeRecord, setFeeRecord] = useState<StudentFeeRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePaymentReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Pay Online / Inquiry Modal State
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Submit UTR verification form state
  const [showUtrForm, setShowUtrForm] = useState<boolean>(false);
  const [utrAmount, setUtrAmount] = useState<string>('');
  const [utrMode, setUtrMode] = useState<'UPI' | 'Bank Transfer' | 'Cash'>('UPI');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [utrRemarks, setUtrRemarks] = useState<string>('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState<boolean>(false);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState<string>('');

  const fetchFeeRecord = async () => {
    setIsLoading(true);
    try {
      // Check local storage override first for instant sync
      if (user?.id) {
        const localData = localStorage.getItem(`goodway_student_fee_${user.id}`);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            setFeeRecord(parsed);
          } catch {
            // continue to server fetch
          }
        }
      }

      const res = await fetch('/api/student/fee', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.feeRecord) {
          setFeeRecord(data.feeRecord);
          if (user?.id) {
            localStorage.setItem(`goodway_student_fee_${user.id}`, JSON.stringify(data.feeRecord));
          }
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // ignore network errors
    }

    // Static fallback for Netlify
    if (user?.id && DEFAULT_STUDENT_FEES[user.id]) {
      setFeeRecord((prev) => prev || DEFAULT_STUDENT_FEES[user.id]);
    } else {
      setFeeRecord((prev) => prev || DEFAULT_STUDENT_FEES['student-1']);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeeRecord();
  }, [token, user]);

  const handleOpenReceipt = (receipt: FeePaymentReceipt) => {
    setSelectedReceipt(receipt);
    setIsReceiptModalOpen(true);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('goodwaycoaching@upi');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrAmount || !utrNumber.trim()) {
      alert('कृपया भुगतान राशि और UTR/Transaction Reference दर्ज करें।');
      return;
    }

    setIsSubmittingUtr(true);
    setUtrSuccessMsg('');

    try {
      const res = await fetch('/api/student/fee/submit-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: Number(utrAmount),
          paymentMode: utrMode,
          transactionRef: utrNumber.trim(),
          remarks: utrRemarks.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUtrSuccessMsg(data.message || 'भुगतान विवरण सफलतापूर्वक कार्यालय को भेज दिया गया है।');
        setUtrAmount('');
        setUtrNumber('');
        setUtrRemarks('');
        if (onNotifyToast) {
          onNotifyToast('Payment UTR details submitted for office verification!', 'success');
        }
      } else {
        alert(data.message || 'Error submitting details');
      }
    } catch {
      alert('Network error while submitting UTR details.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Loading Student Fee Records & Receipts...</p>
        <p className="text-xs text-slate-400">आपकी फीस एवं रसीदों का विवरण लोड हो रहा है...</p>
      </div>
    );
  }

  if (!feeRecord) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3 shadow-sm">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">Fee Profile Not Available</h3>
        <p className="text-xs text-slate-500">
          कृपया कोचिंग कार्यालय (Director Alok Singh) से संपर्क करें।
        </p>
      </div>
    );
  }

  const percentPaid = feeRecord.totalAnnualFee > 0
    ? Math.min(100, Math.round((feeRecord.totalPaid / feeRecord.totalAnnualFee) * 100))
    : 0;

  // Determine refined status badge: Paid (Green), Partial (Yellow), Overdue (Red)
  const isFullyPaid = feeRecord.dueAmount <= 0;
  const isPartiallyPaid = !isFullyPaid && feeRecord.totalPaid > 0;
  const isOverdue = !isFullyPaid && feeRecord.totalPaid === 0;

  const lastPayment = feeRecord.paymentHistory && feeRecord.paymentHistory.length > 0
    ? feeRecord.paymentHistory[0]
    : null;

  const whatsappMessage = encodeURIComponent(
    `Hello Goodway Science Coaching Center,\nI am ${feeRecord.studentName} (Roll No: ${feeRecord.rollNo}, Class ${feeRecord.classGrade}th).\nI would like to inquire about my fee payment status.\nRemaining Due Amount: Rs ${feeRecord.dueAmount}.\nPlease provide me with online payment details.`
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Receipt className="w-3.5 h-3.5" />
              <span>My Fee Status & Dues • सत्र: {feeRecord.academicSession}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-white">
              Fee Portal & Financial Ledger (फीस विवरण)
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              छात्र: <strong className="text-white">{feeRecord.studentName}</strong> • रोल नं: <strong className="text-white font-mono">{feeRecord.rollNo}</strong> • कक्षा: <strong className="text-emerald-400">Class {feeRecord.classGrade}th</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            {/* Color-coded Status Badge */}
            <div className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm ${
              isFullyPaid
                ? 'bg-emerald-500 text-white shadow-emerald-950/40'
                : isPartiallyPaid
                ? 'bg-amber-400 text-slate-950 shadow-amber-950/20'
                : 'bg-rose-500 text-white shadow-rose-950/40'
            }`}>
              {isFullyPaid ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Paid (पूर्ण चुकता)</span>
                </>
              ) : isPartiallyPaid ? (
                <>
                  <Clock className="w-4 h-4 text-slate-950" />
                  <span>Partial (आंशिक जमा)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-white" />
                  <span>Overdue / Due (बकाया)</span>
                </>
              )}
            </div>

            {/* Pay Online & Inquiry CTA */}
            <button
              onClick={() => setShowInquiryModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer group"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Online / Inquiry (ऑनलाइन फीस जमा)</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 5 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Course Fee */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Total Course Fee
          </span>
          <div className="text-2xl font-black font-['Outfit'] text-slate-900">
            ₹{feeRecord.totalAnnualFee.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">
            Monthly Rate: <strong className="text-slate-700">₹{feeRecord.monthlyFee.toLocaleString('en-IN')}/mo</strong>
          </p>
        </div>

        {/* Card 2: Paid Amount */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-2 bg-gradient-to-b from-white to-emerald-50/20">
          <span className="text-[11px] uppercase font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Paid Amount (जमा)
          </span>
          <div className="text-2xl font-black font-['Outfit'] text-emerald-700">
            ₹{feeRecord.totalPaid.toLocaleString('en-IN')}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${percentPaid}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 font-semibold">
            {percentPaid}% of total session cleared
          </p>
        </div>

        {/* Card 3: Remaining Due Amount */}
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${
          feeRecord.dueAmount > 0 
            ? 'bg-white border-amber-200' 
            : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[11px] uppercase font-bold flex items-center gap-1.5 ${
            feeRecord.dueAmount > 0 ? 'text-amber-700' : 'text-slate-500'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            Remaining Due Amount
          </span>
          <div className={`text-2xl font-black font-['Outfit'] ${
            feeRecord.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'
          }`}>
            ₹{feeRecord.dueAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500">
            {feeRecord.dueAmount === 0 ? (
              <span className="text-emerald-600 font-bold">No outstanding balance</span>
            ) : (
              <span className="text-rose-600 font-semibold">Dues pending for session</span>
            )}
          </p>
        </div>

        {/* Card 4: Last Payment Date */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Last Payment Date
          </span>
          <div className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-800">
            {lastPayment ? (
              new Date(lastPayment.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            ) : (
              <span className="text-slate-400 text-sm font-normal">None recorded</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {lastPayment ? `Ref: ${lastPayment.receiptNo}` : 'Awaiting first installment'}
          </p>
        </div>

        {/* Card 5: Next Due Date */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Next Due Date
          </span>
          <div className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-800">
            {feeRecord.nextDueDate || 'Session Complete'}
          </div>
          <p className="text-[11px] text-slate-500">
            {feeRecord.dueAmount > 0 ? 'Pay before due date to avoid delay' : 'All session dues cleared'}
          </p>
        </div>
      </div>

      {/* Main Content: Transaction History & Payment Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Simple Transaction History Table & Online UTR Submission */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simple Transaction History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-['Outfit'] font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Transaction History & Receipts (लेनदेन विवरण)
                </h3>
                <p className="text-xs text-slate-500">
                  Authenticated receipts issued by Goodway Science Coaching Center.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-center">
                {feeRecord.paymentHistory.length} Recorded Transactions
              </span>
            </div>

            {feeRecord.paymentHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-medium text-slate-600">No payment transactions recorded yet.</p>
                <p className="text-slate-400">Once you deposit fee at the office or via UPI, receipts will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Receipt No</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Amount Paid</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {feeRecord.paymentHistory.map((receipt) => (
                      <tr key={receipt.id} className="hover:bg-emerald-50/40 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          {new Date(receipt.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-emerald-800">
                          {receipt.receiptNo}
                        </td>
                        <td className="py-3.5 px-4 max-w-[180px] truncate text-slate-800">
                          {receipt.monthOrDescription}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-black font-['Outfit'] text-slate-900">
                          ₹{receipt.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                            receipt.paymentMode === 'UPI'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : receipt.paymentMode === 'Cash'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {receipt.paymentMode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(receipt)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-300" />
                            <span>View / Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paid Online? Submit Payment Confirmation (UTR) Box */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-['Outfit'] font-bold text-base text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Paid Online? Submit Payment Confirmation (UTR / रसीद जमा करें)
                </h3>
                <p className="text-xs text-slate-500">
                  यदि आपने कोचिंग के UPI / Bank में फीस जमा कर दी है, तो 12-digit UTR नंबर यहाँ सबमिट करें।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUtrForm(!showUtrForm)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 text-xs font-bold text-slate-700 cursor-pointer"
              >
                {showUtrForm ? 'Hide Form' : 'Submit UTR'}
              </button>
            </div>

            {showUtrForm && (
              <form onSubmit={handleSubmitUtr} className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in">
                {utrSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{utrSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Amount Paid (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1500"
                      value={utrAmount}
                      onChange={(e) => setUtrAmount(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={utrMode}
                      onChange={(e) => setUtrMode(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="UPI">UPI (PhonePe/GPay/Paytm)</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                      <option value="Cash">Cash (Office Deposit)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Transaction UTR / Ref No *
                    </label>
                    <input
                      type="text"
                      placeholder="12-digit UTR or Reference"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Month / Note / Remarks (वैकल्पिक)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly Tuition Fee for September 2026"
                    value={utrRemarks}
                    onChange={(e) => setUtrRemarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingUtr}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingUtr ? 'Submitting...' : 'Submit Payment for Verification'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right 1 Col: Class Fee Breakdown & Coaching Payment Details */}
        <div className="space-y-6">
          {/* Quick Pay Online & WhatsApp Inquiry Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700 shadow-lg space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-['Outfit'] font-bold text-sm text-white">
                  Pay Online & Inquire (ऑनलाइन भुगतान)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Instant WhatsApp Support & UPI QR
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Have questions about your remaining dues or wish to pay directly via UPI? Reach out to Director Alok Singh directly.
            </p>

            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-slate-950" />
                <span>WhatsApp Fee Inquiry (+91 98765 43210)</span>
              </a>

              <button
                type="button"
                onClick={() => setShowInquiryModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>View Official UPI QR Code</span>
              </button>
            </div>

            {/* Copyable UPI ID Box */}
            <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-bold">Official UPI ID</span>
                <span className="font-mono font-bold text-emerald-400 select-all">
                  goodwaycoaching@upi
                </span>
              </div>
              <button
                onClick={handleCopyUpi}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Class Fee Structure Details */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-['Outfit'] font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Class {feeRecord.classGrade}th Fee Breakdown
            </h3>

            <div className="space-y-2.5">
              {feeRecord.feeStructure.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">{item.label}</span>
                    <span className="text-[10px] text-slate-500">{item.frequency}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 font-mono">
                    {item.amount > 0 ? `₹${item.amount.toLocaleString('en-IN')}` : 'FREE / Included'}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Enrollment Protection:
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-900">
                All digital chapter notes, formula sheets, weekly Sunday tests, and board exam simulation papers are included with your enrollment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Online / WhatsApp / QR Code Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] font-bold text-base text-white">
                    Pay Online & Inquire (फीस भुगतान)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Goodway Science Coaching Official Account
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Student Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Student:</span>
                  <p className="font-bold text-slate-900">{feeRecord.studentName} ({feeRecord.rollNo})</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Remaining Due:</span>
                  <p className="font-black text-rose-600 font-['Outfit'] text-sm">
                    ₹{feeRecord.dueAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* QR Code Placeholder Box */}
              <div className="text-center p-5 bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-dashed border-emerald-300 space-y-3">
                <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative group">
                  {/* Decorative QR Pattern */}
                  <div className="w-full h-full bg-slate-900 rounded-xl flex flex-col items-center justify-center p-3 text-white">
                    <QrCode className="w-24 h-24 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-mono tracking-wider text-emerald-200 font-bold">UPI PAYMENT QR</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Scan with PhonePe, Google Pay, Paytm, or BHIM
                  </p>
                  <p className="text-[11px] text-slate-500">
                    UPI ID: <strong className="text-emerald-700 font-mono">goodwaycoaching@upi</strong>
                  </p>
                </div>
                <button
                  onClick={handleCopyUpi}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUpi ? 'UPI ID Copied!' : 'Copy UPI ID'}</span>
                </button>
              </div>

              {/* Direct WhatsApp Contact */}
              <div className="space-y-2">
                <a
                  href={`https://wa.me/919876543210?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Fee Inquiry on WhatsApp (+91 98765 43210)</span>
                </a>
                <p className="text-[10px] text-slate-400 text-center">
                  Direct contact with Director Alok Singh (M.Sc. Mathematics)
                </p>
              </div>

              {/* Bank Account Details */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank:</span>
                  <span className="font-semibold text-slate-800">Bank of India (BOI), Sasaram</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account No:</span>
                  <span className="font-mono font-bold text-slate-800 select-all">398201948201</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-mono font-bold text-slate-800 select-all">BKID0004521</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <FeeReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={selectedReceipt}
        feeRecord={feeRecord}
      />
    </div>
  );
};
