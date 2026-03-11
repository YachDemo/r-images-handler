use font_kit::source::SystemSource;

pub fn get_system_fonts() -> Vec<String> {
    let source = SystemSource::new();
    if let Ok(mut families) = source.all_families() {
        // Filter out some weird system fonts or just return all
        families.retain(|f| !f.starts_with('.'));
        families.sort();
        families.dedup();
        families
    } else {
        vec![]
    }
}
