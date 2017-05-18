package org.molgenis.security.token;

import org.apache.commons.lang3.time.DateUtils;
import org.molgenis.auth.Token;
import org.molgenis.auth.TokenFactory;
import org.molgenis.auth.User;
import org.molgenis.data.DataService;
import org.molgenis.security.core.runas.RunAsSystem;
import org.molgenis.security.core.token.TokenService;
import org.molgenis.security.core.token.UnknownTokenException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

import static java.lang.String.format;
import static java.util.Objects.requireNonNull;
import static org.molgenis.auth.TokenMetaData.TOKEN;
import static org.molgenis.auth.TokenMetaData.TOKEN_ATTR;
import static org.molgenis.auth.UserMetaData.USER;
import static org.molgenis.auth.UserMetaData.USERNAME;

/**
 * TokensService implementation that uses the DataService
 */
public class DataServiceTokenService implements TokenService
{
	private final TokenGenerator tokenGenerator;
	private final DataService dataService;
	private final UserDetailsService userDetailsService;
	private final TokenFactory tokenFactory;

	public DataServiceTokenService(TokenGenerator tokenGenerator, DataService dataService,
			UserDetailsService userDetailsService, TokenFactory tokenFactory)
	{
		this.tokenGenerator = requireNonNull(tokenGenerator);
		this.dataService = requireNonNull(dataService);
		this.userDetailsService = requireNonNull(userDetailsService);
		this.tokenFactory = requireNonNull(tokenFactory);
	}

	/**
	 * Find a user by a security token
	 *
	 * @param token security token
	 * @return the user or null if not found or token is expired
	 */
	@Override
	@Transactional(readOnly = true)
	@RunAsSystem
	public UserDetails findUserByToken(String token) throws UnknownTokenException
	{
		Token molgenisToken = getMolgenisToken(token);
		return userDetailsService.loadUserByUsername(molgenisToken.getUser().getUsername());
	}

	/**
	 * Generates a token and associates it with a user.
	 * <p>
	 * Token expires in 2 hours
	 *
	 * @param username    username
	 * @param description token description
	 * @return token
	 */
	@Override
	@Transactional
	@RunAsSystem
	public String generateAndStoreToken(String username, String description)
	{
		User user = dataService.query(USER, User.class).eq(USERNAME, username).findOne();
		if (user == null)
		{
			throw new IllegalArgumentException(format("Unknown username [%s]", username));
		}

		String token = tokenGenerator.generateToken();

		Token molgenisToken = tokenFactory.create();
		molgenisToken.setUser(user);
		molgenisToken.setToken(token);
		molgenisToken.setDescription(description);
		molgenisToken.setExpirationDate(DateUtils.addHours(new Date(), 2));
		dataService.add(TOKEN, molgenisToken);

		return token;
	}

	@Override
	@Transactional
	@RunAsSystem
	public void removeToken(String token) throws UnknownTokenException
	{
		Token molgenisToken = getMolgenisToken(token);
		dataService.delete(TOKEN, molgenisToken);
	}

	private Token getMolgenisToken(String token) throws UnknownTokenException
	{
		Token molgenisToken = dataService.query(TOKEN, Token.class).eq(TOKEN_ATTR, token).findOne();
		if ((molgenisToken == null) || ((molgenisToken.getExpirationDate() != null) && new Date()
				.after(molgenisToken.getExpirationDate())))
		{
			throw new UnknownTokenException("Invalid token");
		}

		return molgenisToken;
	}
}
