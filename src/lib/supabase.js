import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL?.trim()
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anon)
export const supabase = isSupabaseConfigured ? createClient(url, anon) : null

export const parseImageUrls = (imageValue = '') => {
  if (!imageValue) return []
  const raw = String(imageValue).trim()
  if (!raw) return []
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return [raw]
}

export const serializeImageUrls = (primaryImage = '', galleryImages = []) => {
  const urls = [primaryImage, ...(galleryImages || [])].filter(Boolean)
  if (urls.length <= 1) return urls[0] || ''
  return JSON.stringify(urls)
}

// Helper: days since a date
export const daysSince = (dateStr) =>
  Math.floor((new Date() - new Date(dateStr)) / 86400000)

// Helper: is product NEW (< 30 days old)
export const isNew = (dateStr) => daysSince(dateStr) <= 30

// Helper: WhatsApp order link
export const waOrderLink = (productName, phone = '91XXXXXXXXXX') =>
  `https://wa.me/${phone}?text=${encodeURIComponent(`Hi UA Interiors, I'm interested in: ${productName}. Please share price and availability.`)}`

// Order status config
export const STATUS = {
  received:         { label: 'Order Received',     color: '#B8860B', next: 'confirmed' },
  confirmed:        { label: 'Confirmed',           color: '#2C4A7C', next: 'advance_paid' },
  advance_paid:     { label: 'Advance Paid ✅',     color: '#2E6B4F', next: 'supplier_ordered' },
  supplier_ordered: { label: 'Supplier Ordered',    color: '#4A3060', next: 'dispatched' },
  dispatched:       { label: 'Dispatched 🚚',       color: '#6B2D2D', next: 'delivered' },
  delivered:        { label: 'Delivered ✅',        color: '#2E6B5E', next: 'completed' },
  completed:        { label: 'Completed 🌟',        color: '#B8860B', next: null },
}

// WhatsApp message per order status
export const statusMessage = (order, status) => {
  const msgs = {
    confirmed:        `Ji ${order.client_name} ji 🙏\n\nAapka order confirm ho gaya!\n📦 Product: ${order.product_name}\n💰 Total: ₹${order.total_amount}\n💳 Advance: ₹${order.advance_amount}\n\nAdvance payment ke liye:\nUPI: [your UPI ID]\n\nPayment ke baad delivery confirm ho jaayegi.`,
    advance_paid:     `${order.client_name} ji, advance receive ho gaya. Thank you! 🙏\n\nHum abhi supplier ko order place kar rahe hain. Dispatch hone pe tracking share karenge.`,
    supplier_ordered: `${order.client_name} ji, aapka order supplier ko place kar diya gaya hai. 📦\n\nExpected delivery: ${order.expected_delivery || '3-5 din'}\n\nTracking milte hi share karenge!`,
    dispatched:       `${order.client_name} ji, aapka order dispatch ho gaya! 🚚\n\nTracking: ${order.tracking_number || 'N/A'}\nExpected: ${order.expected_delivery || 'Shortly'}\n\nKoi bhi sawaal ho toh message karo. 🙏`,
    delivered:        `${order.client_name} ji, delivery ho gayi? 😊\n\nBalance payment: ₹${order.balance_amount}\nUPI: [your UPI ID]\n\nEk unboxing photo share karein! 📸`,
    completed:        `${order.client_name} ji, order complete! 🌟\n\nEk chwoti si request — Google review denge kya? Bahut help hoti hai:\n[Google Review Link]\n\nAgayn bahut shukriya! 🙏 UA Interiors`,
  }
  return msgs[status] || ''
}
