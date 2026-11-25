/**
 * Required on every page by the Wizards of the Coast Fan Content Policy, and
 * Scryfall's credit for the card data.
 */
export const FAN_CONTENT_NOTICE =
  'Brewery is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.';

export function Footer() {
  return (
    <footer className="footer">
      <p>{FAN_CONTENT_NOTICE}</p>
      <p>
        Card data and images from <a href="https://scryfall.com">Scryfall</a>.
      </p>
    </footer>
  );
}
