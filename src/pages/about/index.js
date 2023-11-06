import * as React from 'react'
import { StaticImage } from 'gatsby-plugin-image'
import Layout from '../../components/layout'
import Seo from '../../components/seo'

const AboutPage = () => {
    return (
        <main>
            <Layout pageTitle="About Me">
                <p>Hi there!  I'm the proud creator of this site, which I build with Gatsby.</p>
                <StaticImage
                    class="h-32 w-32"
                    alt="Picture of Tao B. Schardl"
                    src="../../images/self.jpg"
                />
            </Layout>
        </main>
    )
}

export default AboutPage

export const Head = () => <Seo title="About Me" />