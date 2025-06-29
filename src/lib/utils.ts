import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date, locale: string = 'fr-FR'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date,
  locale: string = 'fr-FR'
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  const startFormatted = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(start)
  
  const endFormatted = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(end)
  
  return `${startFormatted} - ${endFormatted}`
}

export function calculateDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function generateDateRange(startDate: string | Date, endDate: string | Date): Date[] {
  const start = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate)
  const end = typeof endDate === 'string' ? new Date(endDate) : new Date(endDate)
  const dates: Date[] = []
  
  const currentDate = new Date(start)
  while (currentDate < end) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

export function isDateInRange(
  date: string | Date,
  startDate: string | Date,
  endDate: string | Date
): boolean {
  const checkDate = typeof date === 'string' ? new Date(date) : date
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  
  return checkDate >= start && checkDate <= end
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export function getImageUrl(imagePath: string, bucket: string = 'villa-images'): string {
  if (!imagePath) return '/placeholder-villa.jpg'
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath
  
  // If it's a Supabase storage path, construct the full URL
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${imagePath}`
  }
  
  return imagePath
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // French phone number format
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getPackageTierColor(tier: string): string {
  switch (tier) {
    case 'basic':
      return 'bg-gray-100 text-gray-800'
    case 'premium':
      return 'bg-blue-100 text-blue-800'
    case 'luxury':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getPackageTierLabel(tier: string): string {
  switch (tier) {
    case 'basic':
      return 'Basique'
    case 'premium':
      return 'Premium'
    case 'luxury':
      return 'Luxe'
    default:
      return tier
  }
}

export function getBookingStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'En attente'
    case 'confirmed':
      return 'Confirmé'
    case 'cancelled':
      return 'Annulé'
    case 'completed':
      return 'Terminé'
    default:
      return status
  }
}

export function getUserRoleLabel(role: string): string {
  switch (role) {
    case 'customer':
      return 'Client'
    case 'admin':
      return 'Administrateur'
    case 'owner':
      return 'Propriétaire'
    default:
      return role
  }
}