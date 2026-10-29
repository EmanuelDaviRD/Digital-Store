import Layout from './Layout';
import Section from '../components/Section';

export default function PlaceholderPage({ title }) {
  return (
    <Layout>
      <div className="container" style={{ paddingTop: 40, minHeight: 320 }}>
        <Section title={title}>
          <p>Esta página ainda não faz parte do escopo do projeto.</p>
        </Section>
      </div>
    </Layout>
  );
}
