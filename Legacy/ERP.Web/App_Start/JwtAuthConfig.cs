using System;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using ERP.Web.Api.Models.Auth;

namespace ERP.Web.App_Start
{
    public static class JwtAuthConfig
    {
        // JWT configuration - in production, store these in secure configuration
        private static readonly string SecretKey = ConfigurationManager.AppSettings["JwtSecretKey"] ?? "ERP2025_DefaultSecretKey_ChangeInProduction_MinLength32Chars!";
        private static readonly string Issuer = ConfigurationManager.AppSettings["JwtIssuer"] ?? "ERP2025";
        private static readonly string Audience = ConfigurationManager.AppSettings["JwtAudience"] ?? "ERP2025Client";
        private static readonly int AccessTokenExpiryMinutes = int.Parse(ConfigurationManager.AppSettings["JwtAccessTokenExpiryMinutes"] ?? "15");
        private static readonly int RefreshTokenExpiryDays = int.Parse(ConfigurationManager.AppSettings["JwtRefreshTokenExpiryDays"] ?? "7");

        public static string GenerateAccessToken(int userId, int societyId, int roleId, string username)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, username),
                new Claim("societyId", societyId.ToString()),
                new Claim("roleId", roleId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                issuer: Issuer,
                audience: Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(AccessTokenExpiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static string GenerateRefreshToken()
        {
            var randomBytes = new byte[64];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomBytes);
            }
            return Convert.ToBase64String(randomBytes);
        }

        public static int GetAccessTokenExpirySeconds()
        {
            return AccessTokenExpiryMinutes * 60;
        }

        public static DateTime GetRefreshTokenExpiry()
        {
            return DateTime.UtcNow.AddDays(RefreshTokenExpiryDays);
        }

        public static TokenValidationResult ValidateToken(string token)
        {
            var result = new TokenValidationResult();

            if (string.IsNullOrEmpty(token))
            {
                result.IsValid = false;
                result.ErrorMessage = "Token is required";
                return result;
            }

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(SecretKey);

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = Issuer,
                    ValidateAudience = true,
                    ValidAudience = Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
                var jwtToken = (JwtSecurityToken)validatedToken;

                result.IsValid = true;
                result.UserId = int.Parse(jwtToken.Subject);
                result.Username = principal.FindFirst(ClaimTypes.Name)?.Value ??
                                  principal.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value;

                var societyIdClaim = principal.FindFirst("societyId");
                if (societyIdClaim != null)
                {
                    result.SocietyId = int.Parse(societyIdClaim.Value);
                }

                var roleIdClaim = principal.FindFirst("roleId");
                if (roleIdClaim != null)
                {
                    result.RoleId = int.Parse(roleIdClaim.Value);
                }
            }
            catch (SecurityTokenExpiredException)
            {
                result.IsValid = false;
                result.ErrorMessage = "Token has expired";
            }
            catch (Exception ex)
            {
                result.IsValid = false;
                result.ErrorMessage = "Invalid token: " + ex.Message;
            }

            return result;
        }
    }
}
