export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  user: UserInfo
}

export interface UserInfo {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string
  roleId: number
  roleName: string
  societyId: number
  societyName: string
  isAdmin: boolean
  photoPath: string | null
}

export interface RefreshTokenRequest {
  refreshToken: string
}
