import AboutIntroHero from "@/components/About/AboutIntroHero";
import CompanyStory from "@/components/About/CompanyStory";
import Certifications from "@/components/About/Certifications";
// import PartnersClients from "@/components/About/PartnersClients";
// import Leadership from "@/components/About/Leadership";
// import ContactCTA from "@/components/About/ContactCTA";

export default function AboutUsPage() {
    return (
        <div>
            <AboutIntroHero />
            <CompanyStory />
            <Certifications />
            {/* <PartnersClients />
            <Leadership /> */}
            {/* <ContactCTA /> */}
        </div>
    )
}
