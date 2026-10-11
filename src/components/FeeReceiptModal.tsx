import React from 'react';
import { FeePaymentReceipt, StudentFeeRecord } from '../types';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap,
  Building2,
  Calendar,
  CreditCard
} from 'lucide-react';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: FeePaymentReceipt | null;
  feeRecord: StudentFeeRecord | null;
}

// Helper to convert Indian numbers to words
function numberToIndianWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(Math.floor(num)) + ' Rupees Only';
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  feeRecord,
}) => {
  if (!isOpen || !receipt || !feeRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-6">
        {/* Action Header - Hidden during print */}
        <div className="print:hidden bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-['Outfit'] font-bold text-sm tracking-wide">
              Official Coaching Fee Receipt (आधिकारिक फीस रसीद)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-amber-50/30 text-slate-900 border-8 border-double border-slate-200 m-2 rounded-xl">
          {/* Top Institute Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <div className="flex items-center justify-center gap-3 mb-1">
              <img 
                src="/logo.png" 
                alt="GOODWAY Official Logo" 
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-xs" 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] font-extrabold tracking-wider uppercase">
                Academic Session: {feeRecord.academicSession}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Outfit'] tracking-tight text-slate-900 uppercase">
              GOODWAY SCIENCE COACHING CENTER
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-800">
              Classes 9th, 10th, 11th & 12th (Science + Arts) • NEET / JEE Foundation
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              Director: <strong className="text-slate-900">Alok Singh (M.Sc. Mathematics)</strong> | Faculty: <strong className="text-slate-900">Shakti Varma (B.Sc. Math)</strong> & <strong className="text-slate-900">Amit Kumar Singh (M.Sc., B.Ed)</strong>
            </p>
            <p className="text-[10px] text-slate-500">
              Helpline: +91 98765 43210 • Sasaram (Rohtas), Bihar
            </p>
          </div>

          {/* Receipt Title & Meta Grid */}
          <div className="my-4 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipt Number</span>
                <span className="text-sm font-extrabold text-emerald-800 font-mono tracking-wider">
                  {receipt.receiptNo}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Issue</span>
                <span className="text-xs font-bold text-slate-800">
                  {new Date(receipt.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Student Name:</span>
                <strong className="text-slate-900 text-sm">{feeRecord.studentName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Roll Number:</span>
                <strong className="text-slate-900 font-mono">{feeRecord.rollNo}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Academic Class:</span>
                <strong className="text-emerald-700 font-bold">Class {feeRecord.classGrade}th</strong>
              </div>
            </div>
          </div>

          {/* Payment Particulars Table */}
          <div className="my-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                  <th className="py-2.5 px-3">S.N.</th>
                  <th className="py-2.5 px-3">Fee Particulars & Description</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-500">1</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{receipt.monthOrDescription}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Ref/UTR: {receipt.transactionRef}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {receipt.paymentMode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-slate-900 text-sm">
                    ₹{receipt.amount.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                  <td colSpan={3} className="py-2.5 px-3 text-right text-slate-700">
                    Total Amount Received / कुल प्राप्त राशि:
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-800 font-black text-base">
                    ₹{receipt.amount.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Amount in Words */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs mb-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Amount in Words (शब्दों में):
            </span>
            <p className="font-semibold text-slate-800 italic">
              {numberToIndianWords(receipt.amount)}
            </p>
          </div>

          {/* Session Summary Snapshot */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100/70 p-3 rounded-lg text-center text-xs mb-6">
            <div>
              <span className="text-[10px] text-slate-500 block">Total Session Fee</span>
              <strong className="text-slate-800 font-bold">₹{feeRecord.totalAnnualFee.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Total Deposited</span>
              <strong className="text-emerald-700 font-bold">₹{feeRecord.totalPaid.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Remaining Due</span>
              <strong className={`font-bold ${feeRecord.dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                ₹{feeRecord.dueAmount.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-4 flex items-end justify-between border-t border-slate-200">
            <div className="text-left space-y-1">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600/40 flex flex-col items-center justify-center text-emerald-800 text-[9px] font-black uppercase text-center p-1 leading-tight transform -rotate-12 bg-emerald-50/50">
                <span>GOODWAY</span>
                <span className="font-bold">OFFICIAL</span>
                <span>SEAL</span>
              </div>
              <p className="text-[9px] text-slate-400">Verified System Generated Receipt</p>
            </div>

            <div className="text-right space-y-1">
              <div className="font-['Outfit'] font-bold text-sm text-slate-900 border-b border-slate-400 pb-1 inline-block min-w-[140px] text-center">
                {receipt.receivedBy || 'Alok Singh (Director)'}
              </div>
              <p className="text-[10px] font-bold text-slate-500">Authorized Signatory</p>
              <p className="text-[9px] text-slate-400">Goodway Science Coaching Center</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
            * This is an authenticated computer-generated receipt for Goodway Science Coaching Center enrolled students.
          </div>
        </div>

        {/* Footer actions for modal view */}
        <div className="print:hidden bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Status: <strong className="text-emerald-600 font-bold">Verified Payment</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Receipt (रसीद प्रिंट करें)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
