/** Data user yang aman dikirim ke client — TIDAK ikut menyertakan passwordHash. */
export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'customer';
}

export interface RegisterResponseDto {
  user: AuthUserDto;
}

export interface LoginResponseDto {
  /** Token JWT mentah. Client mengirimnya kembali di header Authorization. */
  token: string;
  /** Selalu 'Bearer' — penanda cara penyebutan token di header. */
  tokenType: 'Bearer';
  /** Umur token yang masih berlaku, mis. '2h'. */
  expiresIn: string;
  user: AuthUserDto;
}