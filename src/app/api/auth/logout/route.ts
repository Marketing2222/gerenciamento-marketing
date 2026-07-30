import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('current_user_id')

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error: any) {
    console.error('Error logging out:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
